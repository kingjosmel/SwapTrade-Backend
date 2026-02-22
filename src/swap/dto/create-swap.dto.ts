import {
  IsString,
  IsNumber,
  IsPositive,
  IsOptional,
  IsBoolean,
  IsArray,
  Min,
  Max,
  IsEnum,
  IsUUID,
  ArrayMinSize,
  ArrayMaxSize,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSwapDto {
  @ApiProperty({ example: 'user-uuid-123' })
  @IsString()
  userId: string;

  @ApiProperty({ example: 'USDT' })
  @IsString()
  from: string;

  @ApiProperty({ example: 'BTC' })
  @IsString()
  to: string;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @IsPositive()
  amount: number;

  /**
   * Maximum acceptable slippage as a fraction.
   * 0.005 = 0.5%, 0.01 = 1%. Defaults to 0.5%.
   */
  @ApiPropertyOptional({
    example: 0.005,
    description: 'Max slippage fraction (0.005 = 0.5%)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(0.5) // Hard cap at 50% to prevent foot-guns
  slippageTolerance?: number;

  /**
   * When true, the swap is queued in the batch processor
   * instead of executing synchronously.
   */
  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  async?: boolean;

  /**
   * Optional explicit routing path for multi-leg swaps.
   * e.g. ['USDT', 'ETH', 'BTC'] routes USDT→ETH→BTC.
   * When omitted, the pricing service determines the optimal route.
   */
  @ApiPropertyOptional({ example: ['USDT', 'ETH', 'BTC'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(2)
  @ArrayMaxSize(5)
  route?: string[];
}