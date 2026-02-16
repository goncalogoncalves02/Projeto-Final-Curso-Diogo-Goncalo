# Regras de ProGuard para a release build.
# Por agora não é necessário ofuscar o código.
# Ficheiro vazio – regras serão adicionadas quando necessário.

# Manter as classes dos modelos para o Gson não falhar na deserialização
-keep class com.atec.gestao.data.model.** { *; }

# Manter annotations do Retrofit
-keepattributes Signature
-keepattributes Exceptions

# Regras do Retrofit
-dontwarn retrofit2.**
-keep class retrofit2.** { *; }

# Regras do OkHttp
-dontwarn okhttp3.**
-keep class okhttp3.** { *; }

# Regras do Glide
-keep public class * implements com.bumptech.glide.module.GlideModule
-keep class * extends com.bumptech.glide.module.AppGlideModule { <init>(...); }
