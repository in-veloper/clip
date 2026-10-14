package expo.modules.shareimages

import android.content.ClipData
import android.content.Intent
import android.net.Uri
import androidx.core.content.FileProvider
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File

// 다른 라이브러리의 FileProvider 와 매니페스트에서 이름이 겹치지 않게 하는 전용 하위 클래스.
class ClipShareFileProvider : FileProvider()

// 스캔한 페이지 사진들을 안드로이드 공유 창으로 넘긴다(카톡 "나와의 채팅" 등).
// expo-sharing 은 파일 한 개만 보낼 수 있어서, 여러 장을 한 번에 보내려고 직접 붙였다.
class ShareImagesModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ShareImages")

    AsyncFunction("share") { paths: List<String>, title: String?, promise: Promise ->
      try {
        val context = appContext.reactContext ?: throw CodedException("앱 컨텍스트를 찾을 수 없습니다.")
        val activity = appContext.currentActivity ?: throw CodedException("화면을 찾을 수 없습니다.")
        val authority = "${context.packageName}.clipshare"

        val uris = ArrayList<Uri>()
        for (path in paths) {
          val file = File(Uri.parse(path).path ?: path)
          if (!file.exists()) continue
          uris.add(FileProvider.getUriForFile(context, authority, file))
        }
        if (uris.isEmpty()) throw CodedException("공유할 사진을 찾지 못했습니다.")

        val send = if (uris.size == 1) {
          Intent(Intent.ACTION_SEND).putExtra(Intent.EXTRA_STREAM, uris[0])
        } else {
          Intent(Intent.ACTION_SEND_MULTIPLE).putParcelableArrayListExtra(Intent.EXTRA_STREAM, uris)
        }
        send.type = "image/jpeg"
        send.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        // 받는 앱이 여러 장 모두 읽을 수 있게 ClipData 로도 권한을 함께 넘긴다.
        val clip = ClipData.newUri(context.contentResolver, "page", uris[0])
        for (i in 1 until uris.size) clip.addItem(ClipData.Item(uris[i]))
        send.clipData = clip

        val chooser = Intent.createChooser(send, title ?: "공유")
        activity.runOnUiThread {
          try {
            activity.startActivity(chooser)
            promise.resolve(uris.size)
          } catch (e: Exception) {
            promise.reject(CodedException("공유 창을 열지 못했습니다: ${e.message}"))
          }
        }
      } catch (e: CodedException) {
        promise.reject(e)
      } catch (e: Exception) {
        promise.reject(CodedException(e.message ?: "공유에 실패했습니다."))
      }
    }
  }
}
