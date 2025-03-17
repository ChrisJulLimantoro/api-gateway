import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { JwtAuthGuard } from 'src/guard/jwt-auth.guard';

@Controller('')
export class AdminController {
  constructor(
    @Inject('TRANSACTION') private readonly transactionClient: ClientProxy,
  ) {}

  @Get('payout_requests')
  async getAllPayoutRequests(): Promise<any> {
    try {
      const result = await firstValueFrom(
        this.transactionClient.send({ cmd: 'get:payout_requests' }, {}),
      );
      //

      return result;
    } catch (error) {
      return {
        success: false,
        message: error.message,
        errors: [error.message],
        statusCode: 500,
      };
    }
  }

  @Patch('payout_requests')
  async updatePayoutRequest(
    @Body() body: { id: string; proofUrl: string },
  ): Promise<any> {
    try {
      const result = await firstValueFrom(
        this.transactionClient.send(
          { cmd: 'patch:payout_requests/*' },
          { params: { id: body.id }, body },
        ),
      );

      return {
        success: true,
        message: 'Payout request updated successfully!',
        data: result,
        statusCode: 200,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        errors: [error.message],
        statusCode: 500,
      };
    }
  }
}
