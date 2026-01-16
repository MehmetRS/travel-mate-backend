import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto, PaymentResponseDto } from '../dtos/payment.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';

interface AuthenticatedRequest extends Request {
  user: {
    sub: string;
    email: string;
  };
}

@Controller()
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('trips/:tripId/payments')
  @HttpCode(HttpStatus.CREATED)
  async createPayment(
    @Param('tripId') tripId: string,
    @Body() dto: CreatePaymentDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<PaymentResponseDto> {
    return this.paymentsService.createPayment(tripId, req.user.sub, dto);
  }

  @Get('payments/:paymentId')
  async getPayment(
    @Param('paymentId') paymentId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<PaymentResponseDto> {
    return this.paymentsService.getPayment(paymentId, req.user.sub);
  }
}
