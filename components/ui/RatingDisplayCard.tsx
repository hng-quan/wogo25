import { Colors } from '@/lib/common';
import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StarRating } from './StarRating';

interface ReviewData {
  rating: number; // 1-5 star rating
  comment?: string; // Optional review comment
  createdAt?: string; // ISO date string when review was created
  updatedAt?: string; // ISO date string when review was last updated
}

interface RatingDisplayCardProps {
  review: ReviewData; // Rating/review data to display
  serviceName?: string; // Name of the service that was rated
  showEditOption?: boolean; // Whether to show edit/update options (future feature)
}

/**
 * Rating Display Card Component
 * Shows existing rating information in a clean, readable format
 * Displays star rating, comment, and submission date
 */
export function RatingDisplayCard({ 
  review, 
  serviceName = 'dịch vụ',
  showEditOption = false 
}: RatingDisplayCardProps) {

  /**
   * Get descriptive text for rating value
   * @param rating - Rating value (1-5)
   * @returns Descriptive text for the rating
   */
  const getRatingText = (rating: number): string => {
    const ratingTexts = {
      1: 'Rất không hài lòng',
      2: 'Không hài lòng', 
      3: 'Bình thường',
      4: 'Hài lòng',
      5: 'Rất hài lòng'
    };
    return ratingTexts[rating as keyof typeof ratingTexts] || 'Chưa đánh giá';
  };

  /**
   * Format date for display
   * @param dateString - ISO date string
   * @returns Formatted date string for display
   */
  const formatDate = (dateString?: string): string => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMs = now.getTime() - date.getTime();
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      const diffInDays = Math.floor(diffInHours / 24);
      
      // Show relative time for recent reviews
      if (diffInHours < 1) {
        return 'Vừa xong';
      } else if (diffInHours < 24) {
        return `${diffInHours} giờ trước`;
      } else if (diffInDays < 7) {
        return `${diffInDays} ngày trước`;
      } else {
        // Show formatted date for older reviews
        return date.toLocaleDateString('vi-VN', {
          year: 'numeric',
          month: 'short', 
          day: 'numeric'
        });
      }
    } catch {
      return '';
    }
  };

  /**
   * Check if review has meaningful content
   */
  const hasComment = review.comment && review.comment.trim().length > 0;

  return (
    <View style={styles.container}>
      {/* Header with icon and title */}
      <View style={styles.header}>
        <MaterialIcons 
          name="rate-review" 
          size={24} 
          color={Colors.secondary || '#FFB300'} 
        />
        <View style={styles.headerText}>
          <Text style={styles.title}>Đánh giá của bạn</Text>
          {review.createdAt && (
            <Text style={styles.timestamp}>
              {formatDate(review.createdAt)}
            </Text>
          )}
        </View>
      </View>

      {/* Service name */}
      <Text style={styles.serviceName}>
        Dịch vụ: <Text style={styles.serviceNameHighlight}>{serviceName}</Text>
      </Text>

      {/* Star rating display */}
      <View style={styles.ratingSection}>
        <StarRating rating={review.rating} size={24} />
        <Text style={styles.ratingText}>
          {getRatingText(review.rating)}
        </Text>
      </View>

      {/* Comment display */}
      {hasComment && (
        <View style={styles.commentSection}>
          <Text style={styles.commentLabel}>Nhận xét của bạn:</Text>
          <View style={styles.commentBox}>
            <Text style={styles.commentText}>{review.comment}</Text>
          </View>
        </View>
      )}

      {/* Footer with status */}
      <View style={styles.footer}>
        <View style={styles.statusContainer}>
          <MaterialIcons 
            name="check-circle" 
            size={16} 
            color="#4CAF50" 
          />
          <Text style={styles.statusText}>Đánh giá đã gửi</Text>
        </View>
        
        {/* Future feature: Edit rating option */}
        {showEditOption && (
          <Text style={styles.editHint}>
            Liên hệ hỗ trợ để chỉnh sửa đánh giá
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderLeftWidth: 4,
    borderLeftColor: Colors.secondary || '#FFB300',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  serviceName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  serviceNameHighlight: {
    fontWeight: '500',
    color: '#333',
  },
  ratingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.secondary || '#FFB300',
    marginLeft: 12,
  },
  commentSection: {
    marginBottom: 16,
  },
  commentLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  commentBox: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.secondary || '#FFB300',
  },
  commentText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
    marginLeft: 6,
  },
  editHint: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
  },
});