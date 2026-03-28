export const logout = async () => {
  const res = await fetch("http://localhost:8080/api/v1/auth/logout", {
    method: "POST",
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.errors[0].message);
  return data;
};
