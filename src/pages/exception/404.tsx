import Exception from "@/components/exception";
import React from "react";
import { Link } from "umi";

const Exception404 = () => {
  return <Exception type="404" linkElement={Link} redirect="/home" />;
};

export default Exception404;
