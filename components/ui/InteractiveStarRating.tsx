import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface InteractiveStarRatingProps {
  rating: number; // Current rating value (1-5)
  onRatingChange: (rating: number) => void; // Callback when rating changes
  size?: number; // Size of star icons
  disabled?: boolean; // Disable interaction
}

/**
 * Interactive Star Rating Component
 * Allows users to select a rating by tapping on stars (1-5 scale)
 */
export function InteractiveStarRating({ 
  rating, 
  onRatingChange, 
  size = 32, 
  disabled = false 
}: InteractiveStarRatingProps) {
  
  /**
   * Handle star press - set rating to the pressed star's value
   * @param starIndex - 0-based index of the pressed star
   */
  const handleStarPress = (starIndex: number) => {
    if (disabled) return;
    const newRating = starIndex + 1; // Convert to 1-5 scale
    onRatingChange(newRating);
  };

  /**
   * Render individual star based on current rating
   * @param starIndex - 0-based index of the star
   */
  const renderStar = (starIndex: number) => {
    const isSelected = starIndex < rating;
    
    return (
      <TouchableOpacity
        key={starIndex}
        onPress={() => handleStarPress(starIndex)}
        style={[
          styles.starButton,
          disabled && styles.starButtonDisabled
        ]}
        activeOpacity={0.7}
        disabled={disabled}
      >
        <MaterialCommunityIcons
          name={isSelected ? 'star' : 'star-outline'}
          size={size}
          color={isSelected ? '#FFD700' : '#DDD'}
          style={[
            styles.starIcon,
            isSelected && styles.starIconSelected
          ]}
        />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Render 5 stars */}
      {Array.from({ length: 5 }, (_, index) => renderStar(index))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  starButton: {
    padding: 4,
    borderRadius: 4,
  },
  starButtonDisabled: {
    opacity: 0.6,
  },
  starIcon: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  starIconSelected: {
    // Add subtle glow effect for selected stars
    shadowColor: '#FFD700',
    shadowOpacity: 0.4,
    shadowRadius: 3,
  }
});