/**
 * Puerto de autenticación con Toka.
 * Define el contrato para canjear un authCode por un token de Toka.
 */
export interface TokaAuthPort {
  /**
   * Canjea un authCode (de un solo uso) por credenciales de Toka.
   * @param authCode Código de autorización del frontend H5
   * @returns userId y accessToken de Toka
   */
  authenticate(authCode: string): Promise<TokaAuthResult>;
}

export interface TokaAuthResult {
  userId: string;
  accessToken: string;
  tokenType: string;
  expiresIn: number;
}

export const TOKA_AUTH_PORT = Symbol('TOKA_AUTH_PORT');
