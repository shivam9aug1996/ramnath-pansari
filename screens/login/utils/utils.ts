export const validateMobileNumber = (number: string): string => {
  const mobileNumberRegex = /^[6-9]\d{9}$/;
  if (
    number.trim() === "" ||
    !number.match(mobileNumberRegex) ||
    number.length !== 10
  ) {
    return "Please enter valid Mobile number";
  }
  return "";
};
