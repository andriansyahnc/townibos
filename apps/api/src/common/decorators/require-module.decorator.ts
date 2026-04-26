import { SetMetadata } from '@nestjs/common';

export const MODULE_KEY = 'required_module';
export const RequiresModule = (slug: string) => SetMetadata(MODULE_KEY, slug);
