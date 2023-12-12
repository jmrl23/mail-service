import { vendors } from '@jmrl23/express-helper';

export class MailSendDto {
  @vendors.classValidator.IsOptional()
  @vendors.classValidator.IsString()
  @vendors.classValidator.IsNotEmpty()
  from?: string;

  @vendors.classValidator.IsArray()
  @vendors.classValidator.IsString({ each: true })
  @vendors.classValidator.IsNotEmpty({ each: true })
  to: string[];

  @vendors.classValidator.IsOptional()
  @vendors.classValidator.IsString()
  @vendors.classValidator.IsNotEmpty()
  subject?: string;

  @vendors.classValidator.IsOptional()
  @vendors.classValidator.IsString()
  @vendors.classValidator.IsNotEmpty()
  text?: string;

  @vendors.classValidator.IsOptional()
  @vendors.classValidator.IsString()
  @vendors.classValidator.IsNotEmpty()
  html?: string;
}
