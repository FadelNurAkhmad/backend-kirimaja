import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable() // Menandai kelas ini sebagai penyedia (provider) yang dapat di-inject
// 'jwt' adalah nama strategi yang didefinisikan di JwtStrategy (secara default, PassportStrategy(Strategy) menggunakan nama 'jwt')
export class JwtAuthGuard extends AuthGuard('jwt') {} // Mengaktifkan mekanisme autentikasi 'jwt'

// Ini adalah Guard NestJS yang menggunakan JwtStrategy di atas untuk melindungi endpoint (rute)
// dan memastikan bahwa permintaan datang dari pengguna yang terautentikasi.
