import { IsArray, IsNotEmpty, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BulkDeleteDto {
  @ApiProperty({
    description: 'Массив ID для удаления',
    example: [1, 2, 3],
    type: [Number],
    minItems: 1,
  })
  @IsArray()
  @IsNotEmpty({ message: 'Массив ID не может быть пустым' })
  @ArrayMinSize(1, { message: 'Необходимо указать хотя бы один ID' })
  ids!: number[];
}

