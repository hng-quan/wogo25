import { jsonPostAPI } from '@/lib/apiService';
import { Colors } from '@/lib/common';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { InteractiveStarRating } from '../ui/InteractiveStarRating';

interface ServiceRatingModalProps {
  visible: boolean; // Control modal visibility
  onClose: (ratingData?: any) => void; // Callback when modal is closed, with optional rating data
  bookingId: string; // Booking ID to submit rating for
  serviceName?: string; // Service name for display
}

/**
 * Service Rating Modal Component
 * Allows users to rate a completed service with stars (1-5) and optional comment
 */
export function ServiceRatingModal({visible, onClose, bookingId, serviceName = 'dịch vụ'}: ServiceRatingModalProps) {
  // Rating form state
  const [rating, setRating] = useState<number>(5); // Default to 5 stars
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  /**
   * Reset form to initial state
   */
  const resetForm = () => {
    setRating(5);
    setComment('');
    setIsSubmitting(false);
  };

  /**
   * Handle modal close - reset form and call parent callback
   * @param ratingData - Optional rating data to pass back to parent
   */
  const handleClose = (ratingData?: any) => {
    resetForm();
    onClose(ratingData);
  };

  /**
   * Validate rating form data
   * @returns true if form is valid, false otherwise
   */
  const validateForm = (): boolean => {
    if (rating < 1 || rating > 5) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi đánh giá',
        text2: 'Vui lòng chọn số sao từ 1 đến 5',
      });
      return false;
    }

    // Comment is optional, so no validation needed
    return true;
  };

  /**
   * Submit rating to API
   */
  const handleSubmitRating = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    const requestData = {
      bookingId,
      rating,
      comment: comment.trim() || null, // Send null if empty comment
    };

    try {
      const response = await jsonPostAPI('/reviews/create', requestData, undefined, setIsSubmitting);

      console.log('submit rating response', response);
      if (response && response.code === 1000) {
        Toast.show({
          type: 'success',
          text1: 'Đánh giá thành công',
          text2: 'Cảm ơn bạn đã đánh giá dịch vụ!',
        });

        // Create rating data object to pass back to parent
        const ratingData = {
          rating,
          comment: comment.trim() || null,
          createdAt: new Date().toISOString(),
          ...response?.result // Include any additional data from API response
        };
        
        handleClose(ratingData); // Close modal with rating data
      } else {
        Toast.show({
          type: 'error',
          text1: 'Đánh giá thất bại',
          text2: response?.message || 'Có lỗi xảy ra khi gửi đánh giá',
        });
        setIsSubmitting(false);
      }
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Đánh giá thất bại',
        text2: 'Không thể kết nối tới máy chủ',
      });
      setIsSubmitting(false);
    }
  };

  /**
   * Get rating description text based on selected stars
   */
  const getRatingDescription = (starCount: number): string => {
    const descriptions = [
      '', // 0 stars - not used
      'Rất không hài lòng', // 1 star
      'Không hài lòng', // 2 stars
      'Bình thường', // 3 stars
      'Hài lòng', // 4 stars
      'Rất hài lòng', // 5 stars
    ];
    return descriptions[starCount] || '';
  };

  return (
    <Modal visible={visible} transparent={true} animationType='fade' onRequestClose={handleClose}>
      {/* Background overlay */}
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.keyboardAvoidingView}>
              <View style={styles.modalContainer}>
                <ScrollView
                  style={styles.scrollView}
                  contentContainerStyle={styles.scrollContent}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps='handled'>
                  {/* Header */}
                  <View style={styles.header}>
                    <View style={styles.headerContent}>
                      <MaterialIcons name='rate-review' size={28} color={Colors.secondary || '#FFB300'} />
                      <Text style={styles.title}>Đánh giá dịch vụ</Text>
                    </View>

                    <TouchableOpacity onPress={handleClose} style={styles.closeButton} disabled={isSubmitting}>
                      <MaterialIcons name='close' size={24} color='#666' />
                    </TouchableOpacity>
                  </View>

                  {/* Service info */}
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceLabel}>Bạn cảm thấy thế nào về</Text>
                    <Text style={styles.serviceName}>{serviceName}?</Text>
                  </View>

                  {/* Star rating */}
                  <View style={styles.ratingSection}>
                    <InteractiveStarRating
                      rating={rating}
                      onRatingChange={setRating}
                      size={40}
                      disabled={isSubmitting}
                    />

                    {/* Rating description */}
                    <Text style={styles.ratingDescription}>{getRatingDescription(rating)}</Text>
                  </View>

                  {/* Comment input */}
                  <View style={styles.commentSection}>
                    <Text style={styles.commentLabel}>Chia sẻ thêm về trải nghiệm của bạn (tùy chọn)</Text>
                    <TextInput
                      style={styles.commentInput}
                      placeholder='Viết đánh giá của bạn tại đây...'
                      placeholderTextColor='#999'
                      value={comment}
                      onChangeText={setComment}
                      multiline={true}
                      numberOfLines={4}
                      textAlignVertical='top'
                      maxLength={500}
                      editable={!isSubmitting}
                    />
                    <Text style={styles.characterCount}>{comment.length}/500 ký tự</Text>
                  </View>

                  {/* Action buttons */}
                  <View style={styles.buttonContainer}>
                    <TouchableOpacity
                      style={[styles.button, styles.cancelButton]}
                      onPress={handleClose}
                      disabled={isSubmitting}>
                      <Text style={styles.cancelButtonText}>Hủy</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.button, styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                      onPress={handleSubmitRating}
                      disabled={isSubmitting}>
                      {isSubmitting ? (
                        <View style={styles.loadingContainer}>
                          <MaterialIcons name='hourglass-empty' size={16} color='#fff' style={styles.loadingIcon} />
                          <Text style={styles.submitButtonText}>Đang gửi...</Text>
                        </View>
                      ) : (
                        <Text style={styles.submitButtonText}>Gửi đánh giá</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardAvoidingView: {
    width: '100%',
    maxHeight: '90%',
  },
  modalContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 16,
    maxHeight: '100%',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  scrollView: {
    maxHeight: '100%',
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 12,
  },
  closeButton: {
    padding: 4,
    borderRadius: 4,
  },
  serviceInfo: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
  },
  serviceLabel: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  ratingSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  ratingDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.secondary || '#FFB300',
    marginTop: 12,
    textAlign: 'center',
  },
  commentSection: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  commentLabel: {
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
    fontWeight: '500',
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#fafafa',
    minHeight: 100,
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  submitButton: {
    backgroundColor: Colors.secondary || '#FFB300',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingIcon: {
    marginRight: 8,
  },
});
