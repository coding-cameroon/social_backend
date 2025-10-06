import { getAuth } from "@clerk/express";

const protectAuth = async (req, res, next) => {
  const auth = getAuth(req);
  const isAuthenticated = auth.isAuthenticated;

  if (!isAuthenticated) {
    return res
      .status(401)
      .json({
        successs: false,
        message: "Unauthorized. User is not authenticated",
      });
  }
  next();
};

export default protectAuth;
