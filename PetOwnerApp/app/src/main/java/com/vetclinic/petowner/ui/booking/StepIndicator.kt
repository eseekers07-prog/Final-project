package com.vetclinic.petowner.ui.booking

import androidx.compose.foundation.background
import androidx.compose.foundation.clip
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.vetclinic.petowner.ui.theme.SlateSecondary
import com.vetclinic.petowner.ui.theme.TealAccent

@Composable
fun StepIndicator(currentStep: Int, totalSteps: Int = 3) {
    Row(
        Modifier.fillMaxWidth().padding(vertical = 12.dp),
        horizontalArrangement = Arrangement.Center
    ) {
        for (i in 1..totalSteps) {
            val active = i <= currentStep
            Box(
                Modifier
                    .size(if (i == currentStep) 10.dp else 8.dp)
                    .clip(CircleShape)
                    .background(if (active) TealAccent else SlateSecondary.copy(alpha = 0.25f))
            )
            if (i != totalSteps) Spacer(Modifier.width(8.dp))
        }
    }
}
