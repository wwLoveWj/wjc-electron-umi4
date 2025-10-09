import Exception from "@/components/exception";
import React from "react";
import { Link } from "umi";

const Exception403 = () => {
  return <Exception type="403" linkElement={Link} redirect="/home" />;
};

export default Exception403;
