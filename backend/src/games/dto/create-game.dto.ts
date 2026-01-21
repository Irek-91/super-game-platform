import {
  IsInt,
  Min,
  Max,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isOdd', async: false })
export class IsOddConstraint implements ValidatorConstraintInterface {
  validate(value: any): boolean {
    return typeof value === 'number' && value % 2 !== 0;
  }

  defaultMessage(): string {
    return 'diamondsCount must be odd';
  }
}

@ValidatorConstraint({
  name: 'diamondsCountLessThanOrEqualFieldSize2',
  async: false,
})
export class DiamondsCountLessThanOrEqualFieldSize2Constraint implements ValidatorConstraintInterface {
  validate(diamondsCount: any, args: ValidationArguments): boolean {
    const obj = args.object as CreateGameDto;
    return (
      typeof diamondsCount === 'number' &&
      typeof obj.fieldSize === 'number' &&
      diamondsCount <= obj.fieldSize * obj.fieldSize
    );
  }

  defaultMessage(args: ValidationArguments): string {
    const obj = args.object as CreateGameDto;
    return `diamondsCount must be <= fieldSize * fieldSize (${obj.fieldSize * obj.fieldSize})`;
  }
}

export class CreateGameDto {
  /**
   * Размер игрового поля (NxN)
   * Минимум: 2, Максимум: 5
   */
  @IsInt()
  @Min(2)
  @Max(5)
  fieldSize: number;

  /**
   * Количество алмазов на поле
   * Должно быть нечётным и не превышать fieldSize * fieldSize
   */
  @IsInt()
  @Min(1)
  @Validate(IsOddConstraint)
  @Validate(DiamondsCountLessThanOrEqualFieldSize2Constraint)
  diamondsCount: number;
}
