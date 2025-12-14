import { SetMetadata } from '@nestjs/common';
/**
 * Kunci metadata yang digunakan oleh Reflector di PermissionGuard.
 * Semua dekorator di sini harus menggunakan kunci ini agar guard dapat membacanya.
 */

export const PERMISSIONS_KEY = 'permissions';

/**
 * @Description Dekorator default untuk persyaratan izin.
 * Secara implisit mengasumsikan logika 'ALL' (semua izin harus dimiliki).
 * @param permissions Daftar string izin yang diperlukan (misalnya: 'create_user', 'edit_post').
 */
export const RequiredPermissions = (...permissions: string[]) => {
    // Mengatur metadata dengan kunci 'permissions' dan nilai berupa larik string izin.
    // Guard akan menganggap ini sebagai persyaratan 'ALL'.
    return SetMetadata(PERMISSIONS_KEY, permissions);
};

/**
 * @Description Dekorator untuk persyaratan izin 'ANY'.
 * Pengguna hanya perlu memiliki salah satu dari izin yang diberikan.
 * @param permissions Daftar string izin yang diperlukan.
 */
export const RequiredAnyPermissions = (...permissions: string[]) => {
    // Mengatur metadata sebagai objek yang menyertakan properti 'type: any',
    // agar Guard tahu cara memprosesnya.
    return SetMetadata(PERMISSIONS_KEY, { type: 'any', permissions });
};

/**
 * @Description Dekorator eksplisit untuk persyaratan izin 'ALL'.
 * Pengguna harus memiliki semua izin yang diberikan.
 * @param permissions Daftar string izin yang diperlukan.
 */
export const RequiredAllPermissions = (...permissions: string[]) => {
    // Mengatur metadata sebagai objek yang menyertakan properti 'type: all'.
    return SetMetadata(PERMISSIONS_KEY, { type: 'all', permissions });
};
