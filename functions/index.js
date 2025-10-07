/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {onRequest} = require("firebase-functions/v2/https")
const logger = require("firebase-functions/logger")
const {initializeApp, applicationDefault} = require("firebase-admin/app")
const {getFirestore} = require("firebase-admin/firestore")
const {DeepL} = require("deepl-node")

initializeApp({
  credential: applicationDefault(),
})

const db = getFirestore()

const resolveFetch = async (...args) => {
  if (typeof fetch !== "undefined") {
    return fetch(...args)
  }
  const {default: nodeFetch} = await import("node-fetch")
  return nodeFetch(...args)
}

const allowCors = (fn) => async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*")
  res.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
  res.set("Access-Control-Allow-Headers", "Content-Type")

  if (req.method === "OPTIONS") {
    res.status(204).send("")
    return
  }

  try {
    await fn(req, res)
  } catch (error) {
    logger.error("Function error", error)
    res.status(500).json({error: "Internal Server Error"})
  }
}

exports.getPrograms = onRequest(
  {region: "asia-northeast1"},
  allowCors(async (req, res) => {
    if (req.method !== "GET") {
      res.status(405).json({error: "Method Not Allowed"})
      return
    }

    const snapshot = await db.collection("programs").orderBy("order", "asc").get().catch(async () => {
      return db.collection("programs").get()
    })
    const programs = snapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}))
    res.json({programs})
  })
)

exports.addReceptionRecord = onRequest(
  {region: "asia-northeast1"},
  allowCors(async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({error: "Method Not Allowed"})
      return
    }

    const payload = req.body

    if (!payload?.attendee || !payload?.selections) {
      res.status(400).json({error: "Invalid payload"})
      return
    }

    const docRef = await db.collection("receptions").add({
      ...payload,
      status: payload.status ?? "waiting",
      createdAt: new Date().toISOString(),
    })

    res.json({id: docRef.id})
  })
)

exports.getReceptionStats = onRequest(
  {region: "asia-northeast1"},
  allowCors(async (req, res) => {
    if (req.method !== "GET") {
      res.status(405).json({error: "Method Not Allowed"})
      return
    }

    const snapshot = await db.collection("receptions").get()

    let completed = 0
    let waiting = 0
    let reserved = 0
    let walkIn = 0

    snapshot.forEach((doc) => {
      const data = doc.data()
      if (data.status === "completed") {
        completed += 1
      }
      if (data.status === "waiting") {
        waiting += 1
      }
      if (data?.attendee?.reserved) {
        reserved += 1
      } else {
        walkIn += 1
      }
    })

    res.json({completed, waiting, reserved, walkIn})
  })
)

const ruleBasedTranslate = (text, targetLang) => {
  if (!text) {
    return ""
  }
  const dictionaries = {
    EN: {
      "予約": "reservation",
      "受付": "reception",
      "完了": "completed",
    },
    JA: {
      reservation: "予約",
      reception: "受付",
      completed: "完了",
    },
  }

  const dict = dictionaries[targetLang?.toUpperCase()] ?? {}
  return text
    .split(/(\s+)/)
    .map((segment) => dict[segment.toLowerCase()] ?? dict[segment] ?? segment)
    .join("")
}

exports.translateText = onRequest(
  {region: "asia-northeast1"},
  allowCors(async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({error: "Method Not Allowed"})
      return
    }

    const {text, targetLang} = req.body

    if (!text || !targetLang) {
      res.status(400).json({error: "Missing text or targetLang"})
      return
    }

    const apiKey = process.env.DEEPL_API_KEY

    if (!apiKey) {
      const fallback = ruleBasedTranslate(text, targetLang)
      res.json({translation: fallback, provider: "rule-based"})
      return
    }

    try {
      const client = new DeepL({authKey: apiKey, fetch: resolveFetch})
      const result = await client.translateText(text, null, targetLang)
      res.json({translation: result.text, provider: "deepl"})
    } catch (error) {
      logger.error("DeepL translation failed", error)
      const fallback = ruleBasedTranslate(text, targetLang)
      res.json({translation: fallback, provider: "rule-based"})
    }
  })
)
