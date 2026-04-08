/**
 * Puerto para obtener información de usuario desde Toka.
 */
export interface TokaUserInfoPort {
  /**
   * Obtiene información extendida del perfil del usuario desde Toka.
   * @param accessToken Token de acceso de Toka.
   * @param authCodes Array de códigos de autorización (hasta 5) obtenidos por el H5.
   */
  getUserInfo(accessToken: string, authCodes: string[]): Promise<TokaUserInfo>;
}

export interface TokaUserInfo {
  nickName?: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  gender?: string;
  email?: string;
  mobilePhone?: string;
  birthday?: number;
  nationality?: string;
  birthState?: string;
  kycState?: string;
}

export const TOKA_USER_INFO_PORT = Symbol('TOKA_USER_INFO_PORT');

