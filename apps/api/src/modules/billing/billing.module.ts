import {
  Body,
  Controller,
  Get,
  Injectable,
  Module,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { IsString } from 'class-validator';
import Stripe from 'stripe';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { Public } from '../../common/decorators';
import {
  FeatureFlagGuard,
  FeatureFlagsService,
  RequireFlag,
} from '../../common/feature-flags';

class CheckoutDto {
  @IsString() teamId!: string;
  @IsString() tier!: string; // pro | business
}

@Injectable()
export class BillingService {
  private readonly stripe: Stripe | null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    const key = config.get<string>('stripe.secretKey');
    this.stripe = key ? new Stripe(key, { apiVersion: '2024-06-20' }) : null;
  }

  async checkout(dto: CheckoutDto) {
    if (!this.stripe) return { url: `${this.config.get('webUrl')}/billing?mock=1` };
    const prices = this.config.get('stripe.prices') as { pro: string; business: string };
    const price = dto.tier === 'business' ? prices.business : prices.pro;
    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price, quantity: 1 }],
      success_url: `${this.config.get('webUrl')}/billing?success=1`,
      cancel_url: `${this.config.get('webUrl')}/billing?canceled=1`,
      metadata: { teamId: dto.teamId, tier: dto.tier },
    });
    return { url: session.url };
  }

  async handleWebhook(signature: string, payload: Buffer) {
    if (!this.stripe) return { received: true, mock: true };
    const secret = this.config.get<string>('stripe.webhookSecret')!;
    const event = this.stripe.webhooks.constructEvent(payload, signature, secret);
    switch (event.type) {
      case 'checkout.session.completed':
      case 'customer.subscription.updated':
        // sync subscription status → Subscription table (elided for brevity)
        break;
      case 'invoice.paid':
        // persist Invoice row
        break;
    }
    return { received: true };
  }

  async credits(teamId: string) {
    const wallet = await this.prisma.creditWallet.findUnique({
      where: { teamId },
      include: { transactions: { orderBy: { createdAt: 'desc' }, take: 20 } },
    });
    return { balance: wallet?.balance ?? 0, transactions: wallet?.transactions ?? [] };
  }

  async topUp(teamId: string, amount: number) {
    const wallet = await this.prisma.creditWallet.findUniqueOrThrow({ where: { teamId } });
    const balanceAfter = wallet.balance + amount;
    await this.prisma.$transaction([
      this.prisma.creditWallet.update({ where: { teamId }, data: { balance: balanceAfter } }),
      this.prisma.creditTransaction.create({
        data: { walletId: wallet.id, type: 'TOPUP', amount, balanceAfter, reason: 'manual top-up' },
      }),
    ]);
    return { balance: balanceAfter };
  }
}

@ApiTags('billing')
@UseGuards(FeatureFlagGuard)
@RequireFlag('enableBilling')
@Controller({ path: 'billing', version: '1' })
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @Post('checkout')
  checkout(@Body() dto: CheckoutDto) {
    return this.billing.checkout(dto);
  }

  @Public()
  @Post('webhook')
  webhook(@Body() body: any) {
    // Signature verification wired in main.ts raw-body middleware; simplified here.
    return this.billing.handleWebhook(body?.signature ?? '', Buffer.from(JSON.stringify(body)));
  }
}

@ApiTags('credits')
@Controller({ path: 'credits', version: '1' })
export class CreditsController {
  constructor(private readonly billing: BillingService) {}

  @Get()
  credits(@Query('teamId') teamId: string) {
    return this.billing.credits(teamId);
  }

  @Post('topup')
  topUp(@Body() body: { teamId: string; amount: number }) {
    return this.billing.topUp(body.teamId, body.amount);
  }
}

@Module({
  providers: [BillingService, FeatureFlagsService],
  controllers: [BillingController, CreditsController],
  exports: [BillingService],
})
export class BillingModule {}
