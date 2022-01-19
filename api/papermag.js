import axios from 'axios'
const NewebPay = require('@mirrormedia/newebpay-node')

const {
  NEWEBPAY_PAPERMAG_KEY,
  NEWEBPAY_PAPERMAG_IV,
  ISRAFEL_PATH,
  DOMAIN_NAME,
  API_PROTOCOL,
} = require('../configs/config')

const apiUrl = `${ISRAFEL_PATH}/api/graphql`

async function fireGqlRequest(query, variables) {
  try {
    const { data: result } = await axios({
      url: apiUrl,
      method: 'post',
      data: {
        query,
        variables,
      },
      headers: {
        'content-type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    })
    if (result.errors) {
      throw new Error(result.errors[0].message)
    }
    return result
  } catch (error) {
    throw new Error(error.message)
  }
}

async function getPaymentDataOfPapermagSubscription(gateWayPayload) {
  const fetchPaymentDataOfPapermag = `mutation fetchPaymentDataOfPapermag(
    $data: createNewebpayTradeInfoForMagazineOrderInput!
  ) {
    createNewebpayTradeInfoForMagazineOrder(data: $data) {
      MerchantID
      RespondType
      TimeStamp
      Version
      MerchantOrderNo
      Amt
      ItemDesc
      LoginType
      Email
      TradeLimit
      NotifyURL
    }
  }
  `
  const { data } = await fireGqlRequest(
    fetchPaymentDataOfPapermag,
    gateWayPayload
  )
  data.createNewebpayTradeInfoForMagazineOrder.ReturnURL = `${API_PROTOCOL}://${DOMAIN_NAME}/papermag/return`
  return data
}

module.exports = async function (req, res) {
  console.log('enter server')
  const tradeInfo = req.body
  try {
    const data = await getPaymentDataOfPapermagSubscription(tradeInfo)
    const infoForNewebpay = data.createNewebpayTradeInfoForMagazineOrder

    const newebpay = new NewebPay(NEWEBPAY_PAPERMAG_KEY, NEWEBPAY_PAPERMAG_IV)
    const encryptPostData = await newebpay.getEncryptedFormPostData(
      infoForNewebpay
    )

    res.send(encryptPostData)
  } catch (e) {
    console.log(e)
    res.send(e)
  }
}