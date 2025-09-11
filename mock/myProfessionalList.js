export const myProfessionalList = [
        {
            "id": 5,
            "totalOrders": 0,
            "totalRevenue": 0.00,
            "worker": {
                "id": 2,
                "description": "",
                "totalJobs": 0,
                "totalReviews": 0,
                "averageRating": 0.0
            },
            "service": {
                "parentService": {
                    "id": 2,
                    "serviceName": "Nước",
                    "description": "Chuyên về sửa chữa liên quan tới nước",
                    "iconUrl": null,
                    "parentId": null,
                    "active": true
                },
                "childServices": [
                    {
                        "id": 3,
                        "serviceName": "Thợ ống nước",
                        "description": "Chuyên về sửa chữa liên quan tới ống nước",
                        "iconUrl": null,
                        "parentId": 2,
                        "active": true
                    }
                ]
            },
            "active": true
        }
    ]