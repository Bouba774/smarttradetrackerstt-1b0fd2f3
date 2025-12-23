// Generates Expert Advisor code for MetaTrader 4 and 5
// that sends trade data to the webhook endpoint

export const generateMT4EA = (webhookUrl: string, userToken: string): string => {
  return `//+------------------------------------------------------------------+
//|                                          TradeJournal_Sync.mq4   |
//|                                       Trade Journal Auto-Sync    |
//|                             Sends trades to your journal app     |
//+------------------------------------------------------------------+
#property copyright "Trade Journal"
#property link      ""
#property version   "1.00"
#property strict

//--- Input parameters
input string WebhookURL = "${webhookUrl}";
input string UserToken = "${userToken}";
input int SyncIntervalSeconds = 30;

//--- Global variables
datetime lastSyncTime = 0;
int lastOrdersTotal = 0;

//+------------------------------------------------------------------+
//| Expert initialization function                                     |
//+------------------------------------------------------------------+
int OnInit()
{
   Print("Trade Journal Sync EA initialized");
   Print("Webhook URL: ", WebhookURL);
   
   // Initial sync of all closed trades
   SyncClosedTrades();
   
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                  |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   Print("Trade Journal Sync EA stopped");
}

//+------------------------------------------------------------------+
//| Expert tick function                                               |
//+------------------------------------------------------------------+
void OnTick()
{
   // Check for new or closed orders
   if(OrdersTotal() != lastOrdersTotal)
   {
      CheckOrderChanges();
      lastOrdersTotal = OrdersTotal();
   }
   
   // Periodic sync
   if(TimeCurrent() - lastSyncTime > SyncIntervalSeconds)
   {
      SyncClosedTrades();
      lastSyncTime = TimeCurrent();
   }
}

//+------------------------------------------------------------------+
//| Check for order changes                                            |
//+------------------------------------------------------------------+
void CheckOrderChanges()
{
   // Check open orders
   for(int i = 0; i < OrdersTotal(); i++)
   {
      if(OrderSelect(i, SELECT_BY_POS, MODE_TRADES))
      {
         if(OrderType() == OP_BUY || OrderType() == OP_SELL)
         {
            SendTradeToWebhook(OrderTicket(), "open");
         }
      }
   }
}

//+------------------------------------------------------------------+
//| Sync closed trades from history                                    |
//+------------------------------------------------------------------+
void SyncClosedTrades()
{
   datetime startDate = TimeCurrent() - 86400 * 30; // Last 30 days
   
   int historyTotal = OrdersHistoryTotal();
   
   for(int i = 0; i < historyTotal; i++)
   {
      if(OrderSelect(i, SELECT_BY_POS, MODE_HISTORY))
      {
         if(OrderCloseTime() >= startDate)
         {
            if(OrderType() == OP_BUY || OrderType() == OP_SELL)
            {
               SendTradeToWebhook(OrderTicket(), "sync");
            }
         }
      }
   }
}

//+------------------------------------------------------------------+
//| Send trade data to webhook                                         |
//+------------------------------------------------------------------+
void SendTradeToWebhook(int ticket, string action)
{
   if(!OrderSelect(ticket, SELECT_BY_TICKET))
   {
      Print("Cannot select order: ", ticket);
      return;
   }
   
   string jsonData = "{";
   jsonData += "\\"ticket\\":" + IntegerToString(OrderTicket()) + ",";
   jsonData += "\\"symbol\\":\\"" + OrderSymbol() + "\\",";
   jsonData += "\\"type\\":" + IntegerToString(OrderType()) + ",";
   jsonData += "\\"lots\\":" + DoubleToString(OrderLots(), 2) + ",";
   jsonData += "\\"openPrice\\":" + DoubleToString(OrderOpenPrice(), 5) + ",";
   
   if(OrderCloseTime() > 0)
   {
      jsonData += "\\"closePrice\\":" + DoubleToString(OrderClosePrice(), 5) + ",";
      jsonData += "\\"closeTime\\":\\"" + TimeToString(OrderCloseTime(), TIME_DATE|TIME_SECONDS) + "\\",";
   }
   
   jsonData += "\\"stopLoss\\":" + DoubleToString(OrderStopLoss(), 5) + ",";
   jsonData += "\\"takeProfit\\":" + DoubleToString(OrderTakeProfit(), 5) + ",";
   jsonData += "\\"profit\\":" + DoubleToString(OrderProfit(), 2) + ",";
   jsonData += "\\"openTime\\":\\"" + TimeToString(OrderOpenTime(), TIME_DATE|TIME_SECONDS) + "\\",";
   jsonData += "\\"comment\\":\\"" + OrderComment() + "\\",";
   jsonData += "\\"magic\\":" + IntegerToString(OrderMagicNumber()) + ",";
   jsonData += "\\"accountNumber\\":\\"" + IntegerToString(AccountNumber()) + "\\",";
   jsonData += "\\"action\\":\\"" + action + "\\"";
   jsonData += "}";
   
   string headers = "Content-Type: application/json\\r\\nx-user-token: " + UserToken;
   
   char data[];
   char result[];
   string resultHeaders;
   
   StringToCharArray(jsonData, data);
   ArrayResize(data, ArraySize(data) - 1); // Remove null terminator
   
   int timeout = 5000;
   int response = WebRequest("POST", WebhookURL, headers, timeout, data, result, resultHeaders);
   
   if(response == -1)
   {
      int error = GetLastError();
      Print("WebRequest error: ", error, " - Make sure to add URL to allowed list in Tools > Options > Expert Advisors");
   }
   else
   {
      string resultStr = CharArrayToString(result);
      Print("Trade synced: ", OrderTicket(), " Response: ", resultStr);
   }
}
//+------------------------------------------------------------------+
`;
};

export const generateMT5EA = (webhookUrl: string, userToken: string): string => {
  return `//+------------------------------------------------------------------+
//|                                          TradeJournal_Sync.mq5   |
//|                                       Trade Journal Auto-Sync    |
//|                             Sends trades to your journal app     |
//+------------------------------------------------------------------+
#property copyright "Trade Journal"
#property link      ""
#property version   "1.00"

//--- Input parameters
input string WebhookURL = "${webhookUrl}";
input string UserToken = "${userToken}";
input int SyncIntervalSeconds = 30;

//--- Global variables
datetime lastSyncTime = 0;
int lastPositionsTotal = 0;

//+------------------------------------------------------------------+
//| Expert initialization function                                     |
//+------------------------------------------------------------------+
int OnInit()
{
   Print("Trade Journal Sync EA initialized");
   Print("Webhook URL: ", WebhookURL);
   
   // Initial sync of deal history
   SyncDealHistory();
   
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                  |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   Print("Trade Journal Sync EA stopped");
}

//+------------------------------------------------------------------+
//| Expert tick function                                               |
//+------------------------------------------------------------------+
void OnTick()
{
   // Check for position changes
   if(PositionsTotal() != lastPositionsTotal)
   {
      CheckPositionChanges();
      lastPositionsTotal = PositionsTotal();
   }
   
   // Periodic sync
   if(TimeCurrent() - lastSyncTime > SyncIntervalSeconds)
   {
      SyncDealHistory();
      lastSyncTime = TimeCurrent();
   }
}

//+------------------------------------------------------------------+
//| Check for position changes                                         |
//+------------------------------------------------------------------+
void CheckPositionChanges()
{
   for(int i = 0; i < PositionsTotal(); i++)
   {
      ulong ticket = PositionGetTicket(i);
      if(ticket > 0)
      {
         if(PositionSelectByTicket(ticket))
         {
            SendPositionToWebhook(ticket, "open");
         }
      }
   }
}

//+------------------------------------------------------------------+
//| Sync deal history                                                  |
//+------------------------------------------------------------------+
void SyncDealHistory()
{
   datetime startDate = TimeCurrent() - 86400 * 30; // Last 30 days
   datetime endDate = TimeCurrent();
   
   HistorySelect(startDate, endDate);
   
   int dealsTotal = HistoryDealsTotal();
   
   for(int i = 0; i < dealsTotal; i++)
   {
      ulong dealTicket = HistoryDealGetTicket(i);
      if(dealTicket > 0)
      {
         ENUM_DEAL_ENTRY entry = (ENUM_DEAL_ENTRY)HistoryDealGetInteger(dealTicket, DEAL_ENTRY);
         ENUM_DEAL_TYPE dealType = (ENUM_DEAL_TYPE)HistoryDealGetInteger(dealTicket, DEAL_TYPE);
         
         if(dealType == DEAL_TYPE_BUY || dealType == DEAL_TYPE_SELL)
         {
            SendDealToWebhook(dealTicket, entry == DEAL_ENTRY_IN ? "open" : "close");
         }
      }
   }
}

//+------------------------------------------------------------------+
//| Send position data to webhook                                      |
//+------------------------------------------------------------------+
void SendPositionToWebhook(ulong ticket, string action)
{
   if(!PositionSelectByTicket(ticket)) return;
   
   string jsonData = BuildPositionJson(ticket, action);
   SendToWebhook(jsonData);
}

//+------------------------------------------------------------------+
//| Send deal data to webhook                                          |
//+------------------------------------------------------------------+
void SendDealToWebhook(ulong dealTicket, string action)
{
   string symbol = HistoryDealGetString(dealTicket, DEAL_SYMBOL);
   ENUM_DEAL_TYPE dealType = (ENUM_DEAL_TYPE)HistoryDealGetInteger(dealTicket, DEAL_TYPE);
   double volume = HistoryDealGetDouble(dealTicket, DEAL_VOLUME);
   double price = HistoryDealGetDouble(dealTicket, DEAL_PRICE);
   double profit = HistoryDealGetDouble(dealTicket, DEAL_PROFIT);
   datetime time = (datetime)HistoryDealGetInteger(dealTicket, DEAL_TIME);
   long positionId = HistoryDealGetInteger(dealTicket, DEAL_POSITION_ID);
   string comment = HistoryDealGetString(dealTicket, DEAL_COMMENT);
   long magic = HistoryDealGetInteger(dealTicket, DEAL_MAGIC);
   
   int type = (dealType == DEAL_TYPE_BUY) ? 0 : 1;
   
   string jsonData = "{";
   jsonData += "\\"ticket\\":" + IntegerToString(positionId) + ",";
   jsonData += "\\"symbol\\":\\"" + symbol + "\\",";
   jsonData += "\\"type\\":" + IntegerToString(type) + ",";
   jsonData += "\\"lots\\":" + DoubleToString(volume, 2) + ",";
   
   if(action == "open")
   {
      jsonData += "\\"openPrice\\":" + DoubleToString(price, 5) + ",";
      jsonData += "\\"openTime\\":\\"" + TimeToString(time, TIME_DATE|TIME_SECONDS) + "\\",";
   }
   else
   {
      // Need to find the opening deal for this position
      ulong openingDeal = FindOpeningDeal(positionId);
      if(openingDeal > 0)
      {
         double openPrice = HistoryDealGetDouble(openingDeal, DEAL_PRICE);
         datetime openTime = (datetime)HistoryDealGetInteger(openingDeal, DEAL_TIME);
         jsonData += "\\"openPrice\\":" + DoubleToString(openPrice, 5) + ",";
         jsonData += "\\"openTime\\":\\"" + TimeToString(openTime, TIME_DATE|TIME_SECONDS) + "\\",";
      }
      jsonData += "\\"closePrice\\":" + DoubleToString(price, 5) + ",";
      jsonData += "\\"closeTime\\":\\"" + TimeToString(time, TIME_DATE|TIME_SECONDS) + "\\",";
   }
   
   jsonData += "\\"profit\\":" + DoubleToString(profit, 2) + ",";
   jsonData += "\\"comment\\":\\"" + comment + "\\",";
   jsonData += "\\"magic\\":" + IntegerToString(magic) + ",";
   jsonData += "\\"accountNumber\\":\\"" + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN)) + "\\",";
   jsonData += "\\"action\\":\\"sync\\"";
   jsonData += "}";
   
   SendToWebhook(jsonData);
}

//+------------------------------------------------------------------+
//| Build JSON for position                                            |
//+------------------------------------------------------------------+
string BuildPositionJson(ulong ticket, string action)
{
   string jsonData = "{";
   jsonData += "\\"ticket\\":" + IntegerToString(ticket) + ",";
   jsonData += "\\"symbol\\":\\"" + PositionGetString(POSITION_SYMBOL) + "\\",";
   jsonData += "\\"type\\":" + IntegerToString((int)PositionGetInteger(POSITION_TYPE)) + ",";
   jsonData += "\\"lots\\":" + DoubleToString(PositionGetDouble(POSITION_VOLUME), 2) + ",";
   jsonData += "\\"openPrice\\":" + DoubleToString(PositionGetDouble(POSITION_PRICE_OPEN), 5) + ",";
   jsonData += "\\"stopLoss\\":" + DoubleToString(PositionGetDouble(POSITION_SL), 5) + ",";
   jsonData += "\\"takeProfit\\":" + DoubleToString(PositionGetDouble(POSITION_TP), 5) + ",";
   jsonData += "\\"profit\\":" + DoubleToString(PositionGetDouble(POSITION_PROFIT), 2) + ",";
   jsonData += "\\"openTime\\":\\"" + TimeToString((datetime)PositionGetInteger(POSITION_TIME), TIME_DATE|TIME_SECONDS) + "\\",";
   jsonData += "\\"comment\\":\\"" + PositionGetString(POSITION_COMMENT) + "\\",";
   jsonData += "\\"magic\\":" + IntegerToString((int)PositionGetInteger(POSITION_MAGIC)) + ",";
   jsonData += "\\"accountNumber\\":\\"" + IntegerToString(AccountInfoInteger(ACCOUNT_LOGIN)) + "\\",";
   jsonData += "\\"action\\":\\"" + action + "\\"";
   jsonData += "}";
   return jsonData;
}

//+------------------------------------------------------------------+
//| Find opening deal for a position                                   |
//+------------------------------------------------------------------+
ulong FindOpeningDeal(long positionId)
{
   int dealsTotal = HistoryDealsTotal();
   for(int i = 0; i < dealsTotal; i++)
   {
      ulong dealTicket = HistoryDealGetTicket(i);
      if(HistoryDealGetInteger(dealTicket, DEAL_POSITION_ID) == positionId)
      {
         ENUM_DEAL_ENTRY entry = (ENUM_DEAL_ENTRY)HistoryDealGetInteger(dealTicket, DEAL_ENTRY);
         if(entry == DEAL_ENTRY_IN) return dealTicket;
      }
   }
   return 0;
}

//+------------------------------------------------------------------+
//| Send data to webhook                                               |
//+------------------------------------------------------------------+
void SendToWebhook(string jsonData)
{
   string headers = "Content-Type: application/json\\r\\nx-user-token: " + UserToken;
   
   char data[];
   char result[];
   string resultHeaders;
   
   StringToCharArray(jsonData, data);
   ArrayResize(data, ArraySize(data) - 1);
   
   int timeout = 5000;
   int response = WebRequest("POST", WebhookURL, headers, timeout, data, result, resultHeaders);
   
   if(response == -1)
   {
      int error = GetLastError();
      Print("WebRequest error: ", error, " - Make sure to add URL to allowed list in Tools > Options > Expert Advisors");
   }
   else
   {
      string resultStr = CharArrayToString(result);
      Print("Trade synced. Response: ", resultStr);
   }
}
//+------------------------------------------------------------------+
`;
};

export const downloadEAFile = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
