import { Button } from "antd";
// import classNames from 'classnames';
import type { FC } from "react";
import React, { createElement } from "react";
import { Link } from "umi";
import styles from "./style.less";
import type { ExceptionProps } from "./type";
import config from "./config";

const Exception: FC<ExceptionProps> = (props) => {
  const {
    className,
    backText = "回到首页",
    linkElement = Link,
    type,
    title,
    desc,
    img,
    actions,
    redirect = "/",
    ...rest
  } = props;
  const pageType = type in config ? type : "404";
  //   const clsString = classNames(styles.exception, className);
  return (
    <div className={`${styles.exception} ${className || ""}`} {...rest}>
      <div className={styles.imgBlock}>
        <div
          className={styles.imgEle}
          style={{ backgroundImage: `url(${img || config[pageType].img})` }}
        />
      </div>
      <div className={styles.content}>
        <h1>{title || config[pageType].title}</h1>
        <div className={styles.desc}>{desc || config[pageType].desc}</div>
        <div className={styles.actions}>
          {actions ||
            createElement(
              linkElement,
              {
                to: redirect,
                href: redirect,
              },
              <Button type="primary">{backText}</Button>
            )}
        </div>
      </div>
    </div>
  );
};

export default Exception;
