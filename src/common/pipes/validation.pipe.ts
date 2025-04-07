import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
  ValidationError,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

/**
 * Global Validation Pipe
 * Provides consistent validation error handling across the application
 */
@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    // If no metatype or not a class constructor (built-in types), skip validation
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    // Convert plain objects to class instances
    const object = plainToInstance(metatype, value);
    
    // Validate the object
    const errors = await validate(object);
    
    if (errors.length > 0) {
      // Format validation errors in a consistent, readable structure
      const formattedErrors = this.formatErrors(errors);
      
      throw new BadRequestException({
        message: 'Validation failed',
        errors: formattedErrors,
      });
    }
    
    return object;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype as any);
  }

  private formatErrors(errors: ValidationError[]): Record<string, string[]> {
    return errors.reduce((acc, error) => {
      // Get the property name
      const property = error.property;
      
      // Get all constraint messages
      const messages = error.constraints 
        ? Object.values(error.constraints) 
        : ['Invalid value'];
      
      // Add to accumulator
      acc[property] = messages;
      
      // Handle nested validation errors
      if (error.children && error.children.length > 0) {
        const nestedErrors = this.formatErrors(error.children);
        Object.keys(nestedErrors).forEach(nestedKey => {
          acc[`${property}.${nestedKey}`] = nestedErrors[nestedKey];
        });
      }
      
      return acc;
    }, {} as Record<string, string[]>);
  }
}
