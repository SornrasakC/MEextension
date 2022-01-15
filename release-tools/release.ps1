$title = "MEext-V2.0.0-beta.zip"

$compress = @{
  Path = ".\build"
  CompressionLevel = "Fastest"
  DestinationPath = ".\release-tools\${title}"
}
Compress-Archive @compress
# Compress-Archive @compress -Force
