import Link from "next/link";

const Button = ({
  className,
  colorIcon,
  children,
  type,
  icon: Icon,
  onClick,
  linkTo,
  disabled,
}) => {
  return (
    <>
      {linkTo && (
        <Link
          href={linkTo}
          className={`button ${className} ${disabled ? "disabled-link" : ""}`}
          type={type}
          onClick={onClick}
          disabled={disabled}
        >
          {Icon && <Icon className={`btn-icon ${colorIcon}`} />}
          <p className="p5">{children}</p>
        </Link>
      )}
      {!linkTo && (
        <button
          className={`button ${className}`}
          type={type}
          onClick={onClick}
          disabled={disabled}
        >
          {Icon && <Icon className={`btn-icon ${colorIcon}`} />}
          <p className="p5">{children}</p>
        </button>
      )}
    </>
  );
};

export default Button;
