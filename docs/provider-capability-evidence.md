# Sandbox provider capability evidence

## Google Gemini image generation

Source: https://ai.google.dev/gemini-api/docs/image-generation

The official Gemini API documentation describes native image generation through Gemini image models, including text-to-image and image editing workflows. The documentation names Gemini image models such as `gemini-3.1-flash-image` and shows REST/SDK interaction patterns. Generated images include SynthID watermarking according to the source.

## Google Gemini video generation

Source: https://ai.google.dev/gemini-api/docs/video

The official Gemini API documentation describes video generation through Gemini Omni Flash and Veo. It presents Gemini Omni Flash as a multimodal video generation and editing workflow and Veo for capabilities such as native audio, video extension, and frame-specific generation.

## Groq vision

Source: https://console.groq.com/docs/vision

The official Groq documentation describes multimodal image understanding, visual question answering, caption generation, OCR, JSON mode, tool use, and multi-turn conversations. It is therefore suitable for low-latency text/vision understanding in SyncSenta, not the selected media-generation provider.

## SyncSenta policy decision

SyncSenta selects Gemini for sandbox image/video generation only when the server has `GEMINI_API_KEY` and the explicit feature flag `SYNC_SENTA_ENABLE_MEDIA_GENERATION=true`. Child-facing video requires an additional `SYNC_SENTA_ENABLE_CHILD_VIDEO=true` flag. Real generation remains disabled by default, and no API key is stored in this evidence file.
