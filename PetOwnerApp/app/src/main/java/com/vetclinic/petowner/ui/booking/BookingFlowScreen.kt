package com.vetclinic.petowner.ui.booking

import androidx.compose.material3.Snackbar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.lifecycle.viewmodel.compose.viewModel

/**
 * Single entry point for the Book tab. All 3 steps share ONE BookingViewModel
 * instance (scoped to this composable's nav-graph entry) so the draft survives
 * back-navigation between steps — equivalent to the single `bookingDraft`
 * object kept in the web dashboard's local state.
 */
@Composable
fun BookingFlowScreen(onBookingComplete: () -> Unit) {
    val viewModel: BookingViewModel = viewModel()

    when (viewModel.currentStep) {
        1 -> SelectVetScreen(viewModel)
        2 -> SelectSlotScreen(viewModel)
        3 -> ConfirmBookingScreen(viewModel, onDone = onBookingComplete)
    }
}
