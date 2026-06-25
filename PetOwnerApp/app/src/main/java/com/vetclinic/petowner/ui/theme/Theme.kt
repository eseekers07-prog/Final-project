package com.vetclinic.petowner.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

// "Luxury minimalist" palette — restrained colors, soft elevation rather than
// hard borders (the web app used border-slate-200; here we lean on shadow).
val TealAccent = Color(0xFF0D9488)
val SlateBackground = Color(0xFFFAFAF9)
val SlateText = Color(0xFF0F172A)
val SlateSecondary = Color(0xFF64748B)
val IndigoAccent = Color(0xFF4338CA)
val AmberAccent = Color(0xFFD97706)
val DangerRed = Color(0xFFDC2626)

private val LightColors = lightColorScheme(
    primary = SlateText,
    secondary = TealAccent,
    tertiary = IndigoAccent,
    background = SlateBackground,
    surface = Color.White,
    onPrimary = Color.White,
    onBackground = SlateText,
    onSurface = SlateText,
    error = DangerRed
)

private val AppTypography = Typography(
    headlineMedium = TextStyle(fontSize = 28.sp, fontWeight = FontWeight.Bold),
    headlineSmall = TextStyle(fontSize = 22.sp, fontWeight = FontWeight.Bold),
    titleLarge = TextStyle(fontSize = 19.sp, fontWeight = FontWeight.Bold),
    bodyLarge = TextStyle(fontSize = 15.sp),
    bodyMedium = TextStyle(fontSize = 13.sp),
    labelMedium = TextStyle(fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
)

@Composable
fun PetOwnerTheme(content: @Composable () -> Unit) {
    MaterialTheme(colorScheme = LightColors, typography = AppTypography, content = content)
}
