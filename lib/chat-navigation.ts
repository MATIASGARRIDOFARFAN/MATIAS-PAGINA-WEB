export function buildChatUrl(opts: {
  sellerId: string
  productId: string
  conversationId?: string
}) {
  const params = new URLSearchParams({
    to: opts.sellerId,
    product: opts.productId,
  })
  if (opts.conversationId) {
    params.set("conversationId", opts.conversationId)
  }
  return `/mensajes?${params.toString()}`
}
