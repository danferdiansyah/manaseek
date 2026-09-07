import { ArgumentMetadata, HttpStatus, Injectable, PipeTransform } from '@nestjs/common';
import { ZodError, ZodSchema } from 'zod';
import { AppError, ErrorCode } from '../errors/app-error';

/**
 * Usage: `@Body(new ZodValidationPipe(createBookingSchema)) dto: CreateBookingDto`
 */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown, _metadata: ArgumentMetadata): unknown {
    try {
      return this.schema.parse(value);
    } catch (error) {
      if (error instanceof ZodError) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          'Request validation failed',
          HttpStatus.BAD_REQUEST,
          error.issues.map((issue) => ({
            field: issue.path.join('.') || '(root)',
            message: issue.message,
          })),
        );
      }
      throw error;
    }
  }
}
