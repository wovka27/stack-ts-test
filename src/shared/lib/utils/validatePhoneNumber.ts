export const validatePhoneNumber = (value: string, template: string): boolean => {
  const expectedDigitCount = (template.match(/_/g) || []).length;
  const digits = value.replace(/\D/g, '');

  if (digits.length != expectedDigitCount) return false;

  const regexPattern = template.replace(/([.*+?^${}()|[\]\\])/g, '\\$1').replace(/_/g, '\\d');

  const fullPattern = `^${regexPattern}$`;
  const regex = new RegExp(fullPattern);

  return regex.test(value);
};
