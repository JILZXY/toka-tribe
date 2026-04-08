export interface TokaPaymentPort {
  /**
   * Crea una orden de pago en Toka.
   * @param tokaUserId ID del usuario en Toka.
   * @param orderTitle Título de la orden ('Test' o el nombre del paquete).
   * @param amount Cantidad a cobrar.
   * @param currency Moneda ('MXN').
   * @param accessToken Token de acceso de Toka.
   * @returns El paymentUrl y paymentId devueltos por Toka.
   */
  createPayment(
    tokaUserId: string,
    orderTitle: string,
    amount: number,
    currency: string,
    accessToken: string,
  ): Promise<{ paymentId: string; paymentUrl: string }>;

  /**
   * Consulta el estado de un pago.
   * @param paymentId El ID del pago a consultar.
   * @param accessToken Token de acceso de Toka.
   */
  inquiryPayment(
    paymentId: string,
    accessToken: string,
  ): Promise<{ status: string; resultCode: string }>;
}

export const TOKA_PAYMENT_PORT = Symbol('TOKA_PAYMENT_PORT');
