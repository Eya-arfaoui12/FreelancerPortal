import { useNavigate } from "react-router";

const useGoBack = () => {
  const navigate = useNavigate();

  const goBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1); // Retourne à la page précédente
    } else {
      navigate("/"); // Redirige vers la page d'accueil si pas d'historique
    }
  };

  return goBack;
};

export default useGoBack;
