import { ApiProperty } from '@nestjs/swagger';

export class SelectedItemResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  itemId: string;

  @ApiProperty()
  itemType: 'SERVICE' | 'PRODUCT';

  @ApiProperty()
  priceSnapshot: number;
}

export class RegistrationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  eventDateTime: Date;

  @ApiProperty({
    description: 'Descuento en servicios (%)',
  })
  servicesDiscountPct: number;

  @ApiProperty({
    description: 'Descuento en productos (%)',
  })
  productsDiscountPct: number;

  @ApiProperty({
    type: [SelectedItemResponse],
  })
  items: SelectedItemResponse[];

  @ApiProperty()
  createdAt: Date;
}
