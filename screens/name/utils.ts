export const validateName = (name: string): string => {
  const nameRegex = /^[A-Za-z\s]+$/;
  if (name.trim() === "" || !name.match(nameRegex)) {
    return "Please enter a valid name";
  }
  return "";
};
