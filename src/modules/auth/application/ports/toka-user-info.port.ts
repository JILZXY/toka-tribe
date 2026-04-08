/**
 * Puerto para obtener información de usuario desde Toka.
 */
export interface TokaUserInfoPort {
  /**
   * Obtiene información del perfil del usuario desde la API de Toka.
   * @param accessToken Token de acceso obtenido durante autenticación
   * @returns Información del perfil del usuario
   */
  getUserInfo(accessToken: string): Promise<TokaUserInfo>;
}

export interface TokaUserInfo {
  userId: string;
  nickname?: string;
  avatar?: string;
  email?: string;
}

export const TOKA_USER_INFO_PORT = Symbol('TOKA_USER_INFO_PORT');
