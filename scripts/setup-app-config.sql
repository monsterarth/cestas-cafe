-- Script para configurar as configurações do app no Firestore
-- Este é um exemplo da estrutura que deve ser criada no Firestore

-- Documento: configuracoes/app
-- Campos:
-- {
--   "logoUrl": "https://exemplo.com/logo.png", // URL da logo (opcional)
--   "nomeFazenda": "Fazenda do Rosa",
--   "subtitulo": "Cesta de Café da Manhã Personalizada",
--   "textoIntroducao": "Preparamos tudo com muito carinho para que sua experiência seja inesquecível. Pedimos a gentileza de escolher os itens com consciência, pois os alimentos são frescos e preparados para o seu pedido. Itens não consumidos não poderão ser reaproveitados.",
--   "textoAgradecimento": "Agradecemos sua colaboração para evitarmos o desperdício. Para iniciar, clique em \"Próximo\".",
--   "corPrimaria": "#97A25F",
--   "corSecundaria": "#4B4F36"
-- }

-- Para criar este documento no Firestore, use o console do Firebase ou o código JavaScript:

/*
import { doc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

const appConfig = {
  logoUrl: "https://exemplo.com/logo.png", // Substitua pela URL real da logo
  nomeFazenda: "Fazenda do Rosa",
  subtitulo: "Cesta de Café da Manhã Personalizada",
  textoIntroducao: "Preparamos tudo com muito carinho para que sua experiência seja inesquecível. Pedimos a gentileza de escolher os itens com consciência, pois os alimentos são frescos e preparados para o seu pedido. Itens não consumidos não poderão ser reaproveitados.",
  textoAgradecimento: "Agradecemos sua colaboração para evitarmos o desperdício. Para iniciar, clique em \"Próximo\".",
  corPrimaria: "#97A25F",
  corSecundaria: "#4B4F36"
};

await setDoc(doc(db, "configuracoes", "app"), appConfig);
*/

SELECT 'Configuração do app criada com sucesso!' as message;
