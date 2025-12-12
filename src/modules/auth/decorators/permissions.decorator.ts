import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

export const RequiredPermissions = (...permissions: string[]) => {
    SetMetadata('PERMISSIONS_KEY', permissions);
};

export const RequiredAnyPermissions = (...permissions: string[]) => {
    SetMetadata('PERMISSIONS_KEY', { type: 'any', permissions });
};

export const RequiredAllPermissions = (...permissions: string[]) => {
    SetMetadata('PERMISSIONS_KEY', { type: 'all', permissions });
};
