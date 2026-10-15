class BoardTracker:
    def __init__(self, patience=5):
        self.patience = patience
        self.missed_frames = 0
        self.last_known_box = None

    def update(self, detected_box):
        """
        Updates the tracker with a newly detected bounding box.
        Returns the box to use for the current frame.
        """
        if detected_box is not None:
            self.last_known_box = detected_box
            self.missed_frames = 0
            return detected_box
        else:
            self.missed_frames += 1
            if self.missed_frames <= self.patience:
                # Return the last known box if we temporarily lost it
                return self.last_known_box
            else:
                # Board is considered lost
                self.last_known_box = None
                return None
