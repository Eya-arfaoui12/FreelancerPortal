import React from "react";

const Form = ({ onSubmit, children, className }) => {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault(); // Empêche l'envoi par défaut
        onSubmit(event);
      }}
      className={` ${className}`} // Classe optionnelle
    >
      {children}
    </form>
  );
};

export default Form;
