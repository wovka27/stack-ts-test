export const formatPhone = (val: string, p: string = '+7 (___) ___-__-__') => {
  val = val.replace(/\D+/g, '');
  val = val.substring(0, 12);
  return ((l, i = 0) => p.replace(/./g, (w) => (/[_\d]/.test(w) && i < l ? val.charAt(i++) : i >= l ? '' : w)))(
    val.length
  );
};
