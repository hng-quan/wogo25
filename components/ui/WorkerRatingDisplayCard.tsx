import { Colors } from '@/lib/common';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { StarRating } from './StarRating';

interface CustomerReview {
  id: number; // Review ID
  rating: number; // 1-5 star rating from customer
  content?: string | null; // Customer's review comment (optional)
  createdAt?: string; // ISO date string when review was created
  updatedAt?: string; // ISO date string when review was last updated
}

interface WorkerRatingDisplayCardProps {
  review: CustomerReview; // Customer rating/review data to display
  serviceName?: string; // Name of the completed service
  customerName?: string; // Name of the customer who left the review
  showSummary?: boolean; // Whether to show a summary view or detailed view
}

/**
 * Worker Rating Display Card Component
 * Shows customer ratings and feedback for completed services from worker perspective
 * Displays star rating, customer comments, and service information
 */
export function WorkerRatingDisplayCard({ 
  review, 
  serviceName = 'dịch vụ',
  customerName = 'Khách hàng',
  showSummary = false 
}: WorkerRatingDisplayCardProps) {

  /**
   * Get descriptive text for rating value from customer perspective
   * @param rating - Rating value (1-5)
   * @returns Descriptive text for the rating
   */
  const getRatingDescription = (rating: number): string => {
    const ratingDescriptions = {
      1: 'Khách hàng rất không hài lòng',
      2: 'Khách hàng không hài lòng', 
      3: 'Khách hàng đánh giá bình thường',
      4: 'Khách hàng hài lòng',
      5: 'Khách hàng rất hài lòng'
    };
    return ratingDescriptions[rating as keyof typeof ratingDescriptions] || 'Chưa có đánh giá';
  };

  /**
   * Get icon and color based on rating value
   * @param rating - Rating value (1-5)
   * @returns Object containing icon name and color
   */
  const getRatingIconInfo = (rating: number) => {
    if (rating >= 4) {
      return { icon: 'sentiment-very-satisfied', color: '#4CAF50' }; // Green for good ratings
    } else if (rating >= 3) {
      return { icon: 'sentiment-neutral', color: '#FF9800' }; // Orange for neutral ratings
    } else {
      return { icon: 'sentiment-very-dissatisfied', color: '#F44336' }; // Red for poor ratings
    }
  };

  /**
   * Format date for display with relative time
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
  const hasComment = review.content && review.content.trim().length > 0;

  const iconInfo = getRatingIconInfo(review.rating);

  // Render summary view for compact display
  if (showSummary) {
    return (
      <View style={styles.summaryContainer}>
        <View style={styles.summaryHeader}>
          <MaterialIcons 
            name={iconInfo.icon as any} 
            size={20} 
            color={iconInfo.color} 
          />
          <StarRating rating={review.rating} size={16} />
          <Text style={styles.summaryText}>
            từ {customerName}
          </Text>
        </View>
        {hasComment && (
          <Text style={styles.summaryComment} numberOfLines={2}>
            &ldquo;{review.content}&rdquo;
          </Text>
        )}
      </View>
    );
  }

  // Render detailed view for full display
  return (
    <View style={styles.container}>
      {/* Header with rating icon and customer info */}
      <View style={styles.header}>
        <MaterialIcons 
          name={iconInfo.icon as any} 
          size={28} 
          color={iconInfo.color} 
        />
        <View style={styles.headerText}>
          <Text style={styles.title}>Đánh giá từ khách hàng</Text>
          <Text style={styles.customerName}>{customerName}</Text>
          {review.createdAt && (
            <Text style={styles.timestamp}>
              {formatDate(review.createdAt)}
            </Text>
          )}
        </View>
      </View>

      {/* Service info */}
      <Text style={styles.serviceInfo}>
        Dịch vụ: <Text style={styles.serviceHighlight}>{serviceName}</Text>
      </Text>

      {/* Star rating and description */}
      <View style={[styles.ratingSection, { borderLeftColor: iconInfo.color }]}>
        <View style={styles.ratingHeader}>
          <StarRating rating={review.rating} size={24} />
          <Text style={[styles.ratingText, { color: iconInfo.color }]}>
            {getRatingDescription(review.rating)}
          </Text>
        </View>
      </View>

      {/* Customer comment */}
      {hasComment ? (
        <View style={styles.commentSection}>
          <Text style={styles.commentLabel}>Nhận xét của khách hàng:</Text>
          <View style={[styles.commentBox, { borderLeftColor: iconInfo.color }]}>
            <MaterialCommunityIcons 
              name="format-quote-open" 
              size={16} 
              color="#999" 
              style={styles.quoteIcon}
            />
            <Text style={styles.commentText}>{review.content}</Text>
          </View>
        </View>
      ) : (
        <View style={styles.noCommentSection}>
          <Text style={styles.noCommentText}>
            Khách hàng đã đánh giá nhưng không để lại nhận xét
          </Text>
        </View>
      )}

      {/* Footer with performance indicator */}
      <View style={styles.footer}>
        <View style={styles.performanceContainer}>
          <MaterialCommunityIcons 
            name="chart-line" 
            size={16} 
            color={Colors.primary} 
          />
          <Text style={styles.performanceText}>
            Đánh giá này ảnh hưởng đến điểm trung bình của bạn
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Summary view styles
  summaryContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  summaryText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  summaryComment: {
    fontSize: 12,
    color: '#444',
    fontStyle: 'italic',
    lineHeight: 16,
  },

  // Detailed view styles
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
    borderLeftColor: Colors.primary,
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
  customerName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  serviceInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  serviceHighlight: {
    fontWeight: '500',
    color: '#333',
  },
  ratingSection: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
  },
  ratingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
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
    borderLeftWidth: 4,
    position: 'relative',
  },
  quoteIcon: {
    position: 'absolute',
    top: 8,
    left: 8,
  },
  commentText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
    fontStyle: 'italic',
    paddingLeft: 20,
  },
  noCommentSection: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  noCommentText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  footer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  performanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  performanceText: {
    fontSize: 11,
    color: Colors.primary,
    marginLeft: 6,
    fontWeight: '500',
  },
});