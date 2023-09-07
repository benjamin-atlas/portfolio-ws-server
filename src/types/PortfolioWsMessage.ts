import PortfolioWsMessageType from "./PortfolioWsMessageType";

interface PortfolioWsMessage {
  messageType: PortfolioWsMessageType;
  body: any;
}

export default PortfolioWsMessage;
