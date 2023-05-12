export default function getResendDate(timeBeforeRequireResend: number): string {
  const initialDate = new Date();
  const resendDate = (initialDate.setSeconds(
    initialDate.getSeconds() + timeBeforeRequireResend,
  ),
  initialDate).toISOString();
  return resendDate;
}
