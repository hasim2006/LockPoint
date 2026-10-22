# RoomTrace Cloud Infrastructure (Terraform)
terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "environment" {
  type    = string
  default = "production"
}

# 1. S3 Bucket for Scans, Point Clouds, and Plane Meshes
resource "aws_s3_bucket" "scan_storage" {
  bucket = "roomtrace-${var.environment}-spatial-scans"

  tags = {
    Name        = "RoomTrace Spatial Scans"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_versioning" "scan_storage_versioning" {
  bucket = aws_s3_bucket.scan_storage.id
  versioning_configuration {
    status = "Enabled"
  }
}

# 2. RDS PostgreSQL Database Instance
resource "aws_db_instance" "postgres" {
  identifier           = "roomtrace-${var.environment}-db"
  engine               = "postgres"
  engine_version       = "16.2"
  instance_class       = "db.t4g.medium"
  allocated_storage    = 50
  max_allocated_storage = 500
  storage_type         = "gp3"
  db_name              = "roomtrace"
  username             = "roomtrace_admin"
  manage_master_user_password = true

  skip_final_snapshot = false
  final_snapshot_identifier = "roomtrace-${var.environment}-final-snap"
}

# 3. ElastiCache Redis Cluster for Job Queue & Spatial Cache
resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "roomtrace-${var.environment}-redis"
  engine               = "redis"
  node_type            = "cache.t4g.small"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
}
