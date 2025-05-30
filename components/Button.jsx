import Link from "next/link";
import { ProgressSpinner } from "primereact/progressspinner"; // Importe o spinner do PrimeReact

const Button = ({
  className,
  colorIcon,
  children,
  type,
  icon: Icon,
  onClick,
  linkTo,
  disabled,
  loading = false, // Adicione a nova prop loading
}) => {
  return (
    <>
      {linkTo && (
        <Link
          href={linkTo}
          className={`button ${className} ${disabled ? "disabled-link" : ""}`}
          type={type}
          onClick={onClick}
          disabled={disabled || loading} // Desabilita também quando loading
        >
          {loading ? (
            <ProgressSpinner
              strokeWidth="4"
              style={{ width: "20px", height: "20px" }}
            />
          ) : (
            <>
              {Icon && <Icon className={`btn-icon ${colorIcon}`} />}
              {children && <p className="p5">{children}</p>}
            </>
          )}
        </Link>
      )}
      {!linkTo && (
        <button
          className={`button ${className}`}
          type={type}
          onClick={onClick}
          disabled={disabled || loading} // Desabilita também quando loading
        >
          <>
            {loading && (
              <ProgressSpinner
                strokeWidth="4"
                style={{
                  width: "20px",
                  height: "20px",
                }}
              />
            )}
            {Icon && <Icon className={`btn-icon ${colorIcon}`} />}
            {children && <p className="p5">{children}</p>}
          </>
        </button>
      )}
    </>
  );
};

export default Button;
/** 
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
*/
